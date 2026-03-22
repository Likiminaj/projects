/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion_command_utils.c                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/22 17:56:27 by cpesty            #+#    #+#             */
/*   Updated: 2026/03/20 19:58:38 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		expand_var_ok(char **arg, char *entry, char *vname, int prot);
int		expand_var_nok(char **arg_ptr, char *var_name);
char	*find_content(char *argument);
void	fill_new_arg(char *new, char *src, char *cont, int vlen);
void	swap_new(char **arg_ptr, char *new_arg);

/* Replaces variable with env value in *arg.
prot=1: spaces in the value are marked \x02 (double-quoted, no word split). */
int	expand_var_ok(char **arg, char *entry, char *vname, int prot)
{
	char	*content;
	char	*new_arg;

	content = find_content(entry);
	if (content && prot)
		content = protect_spaces(content);
	if (!content)
		return (1);
	new_arg = malloc(ft_strlen(*arg) - ft_strlen(vname) + ft_strlen(content));
	if (!new_arg)
		return (free(content), 1);
	fill_new_arg(new_arg, *arg, content, ft_strlen(vname));
	swap_new(arg, new_arg);
	return (free(content), 0);
}

/* Removes undefined variable from *arg_ptr (expands to empty string). */
int	expand_var_nok(char **arg_ptr, char *var_name)
{
	char	*new_arg;
	int		j;
	int		k;
	int		len;

	new_arg = malloc(ft_strlen(*arg_ptr) - ft_strlen(var_name));
	if (!new_arg)
		return (1);
	len = ft_strlen(var_name);
	j = 0;
	k = 0;
	while ((*arg_ptr)[k] != '$')
		new_arg[j++] = (*arg_ptr)[k++];
	len += (k + 1);
	while ((*arg_ptr)[len] != '\0')
		new_arg[j++] = (*arg_ptr)[len++];
	new_arg[j] = '\0';
	swap_new(arg_ptr, new_arg);
	return (0);
}

/* Receives an argument such as "var_name=content" and extracts
content only (after =). */
char	*find_content(char *argument)
{
	char	*equal_start;

	if (!argument)
		return (NULL);
	equal_start = ft_strchr(argument, '=');
	if (!equal_start)
		return (NULL);
	return (ft_strdup(equal_start + 1));
}

/* Variable ($VAR) in source string is replaced with content of the variable
that was found in env (*new).*/
void	fill_new_arg(char *new, char *src, char *cont, int vlen)
{
	int	j;
	int	k;
	int	len;

	j = 0;
	k = 0;
	while (src[k] != '$')
		new[j++] = src[k++];
	len = vlen + k + 1;
	k = 0;
	while (cont[k])
		new[j++] = cont[k++];
	while (src[len])
		new[j++] = src[len++];
	new[j] = '\0';
}

/* Frees old argument string and replaces it with the newly built one. */
void	swap_new(char **arg_ptr, char *new_arg)
{
	if (!new_arg)
		return ;
	free(*arg_ptr);
	*arg_ptr = new_arg;
}
