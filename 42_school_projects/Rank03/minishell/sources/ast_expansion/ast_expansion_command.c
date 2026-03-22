/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion_command.c                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/10 15:28:37 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/20 19:58:01 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		expand_var(t_ast *ast, int i, int *exit_status, char **envp);
char	*find_var_name(char *arg);
int		expand_error_code(t_ast *ast, int i, int *exit_status);
int		expand_fst_var(char **arg, char **envp, char *vname, int prot);
int		find_index_in_env(char **envp, char *var_name);

/* Expands all variables in command argument by finding and replacing
each $VAR or \x03VAR (double-quoted dollar). */
int	expand_var(t_ast *ast, int i, int *exit_status, char **envp)
{
	int		j;
	char	*var_name;
	int		protect;

	while (1)
	{
		j = 0;
		while (ast->args[i][j] && ast->args[i][j] != '$' && \
ast->args[i][j] != '\x03')
			j++;
		if (!ast->args[i][j])
			break ;
		protect = (ast->args[i][j] == '\x03');
		ast->args[i][j] = '$';
		var_name = find_var_name(ast->args[i] + j);
		if (!var_name)
			break ;
		if (var_name[0] == '?' && var_name[1] == '\0')
			expand_error_code(ast, i, exit_status);
		else
			expand_fst_var(&ast->args[i], envp, var_name, protect);
		free(var_name);
	}
	return (0);
}

/* In a given string extracts first var_name (after $) */
char	*find_var_name(char *arg)
{
	char	*var_name;
	int		len;

	if (!arg || arg[0] != '$')
		return (NULL);
	if (arg[1] == '?')
	{
		var_name = malloc(2);
		if (!var_name)
			return (NULL);
		var_name[0] = '?';
		var_name[1] = '\0';
	}
	else
	{
		len = 0;
		while (arg[1 + len] != '\0' && char_is_valid(arg[1 + len]) == 1)
			len++;
		var_name = malloc(sizeof(char) * (len + 1));
		if (!var_name)
			return (NULL);
		ft_memcpy(var_name, arg + 1, len);
		var_name[len] = '\0';
	}
	return (var_name);
}

/* Replaces $? with exit status number in command argument string. */
int	expand_error_code(t_ast *ast, int i, int *exit_status)
{
	char	*error_number;
	char	*new_ast;
	int		j;
	int		k;
	int		len;

	error_number = ft_itoa(*exit_status);
	if (!error_number)
		return (1);
	new_ast = malloc(ft_strlen(ast->args[i]) + ft_strlen(error_number) - 1);
	if (!new_ast)
		return (free(error_number), 1);
	j = 0;
	k = 0;
	while (ft_strncmp(ast->args[i] + k, "$?", 2) != 0)
		new_ast[j++] = ast->args[i][k++];
	len = k + 2;
	k = 0;
	while (error_number[k] != '\0')
		new_ast[j++] = error_number[k++];
	while (ast->args[i][len] != '\0')
		new_ast[j++] = ast->args[i][len++];
	new_ast[j] = '\0';
	swap_new(&ast->args[i], new_ast);
	return (free(error_number), 0);
}

/* Expands first variable in *arg by checking environment and replacing.
prot=1 means the dollar was double-quoted: spaces in result are protected. */
int	expand_fst_var(char **arg, char **envp, char *vname, int prot)
{
	int	index;

	index = find_index_in_env(envp, vname);
	if (index != -1)
	{
		if (expand_var_ok(arg, envp[index], vname, prot) == 1)
			return (1);
	}
	else
	{
		if (expand_var_nok(arg, vname) == 1)
			return (1);
	}
	return (0);
}

/* Looks for a specific variable in the environment.
Returns the index of this variable in the env array. */
int	find_index_in_env(char **envp, char *var_name)
{
	int		i;
	size_t	var_len;

	if (!envp || !var_name)
		return (-1);
	var_len = ft_strlen(var_name);
	if (var_len == 0)
		return (-1);
	i = 0;
	while (envp[i] != NULL)
	{
		if ((ft_strncmp(envp[i], var_name, var_len) == 0) \
&& envp[i][var_len] == '=')
			return (i);
		i++;
	}
	return (-1);
}
