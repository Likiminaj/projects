/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_var_utils.c                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/19 15:35:26 by cpesty            #+#    #+#             */
/*   Updated: 2026/02/04 14:48:04 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

void	update_var(t_env *env, char *var_name, char *content);
void	overwrite_var(t_env *env, int index, char *new_var);
char	**add_var(char **envp, char *new_var);
int		equal_found(char *arg);

/* Updates or adds an environment variable to envp. */
void	update_var(t_env *env, char *var_name, char *content)
{
	int		index;
	char	*var_name_eq;
	char	*new_var;

	if (!env || !var_name)
		return ;
	index = find_index_in_env(env->envp, var_name);
	if (!content && index != -1)
		return ;
	var_name_eq = ft_strjoin(var_name, "=");
	if (!var_name_eq)
		return ;
	if (!content)
		new_var = ft_strdup(var_name);
	else
		new_var = ft_strjoin(var_name_eq, content);
	free(var_name_eq);
	if (!new_var)
		return ;
	if (index != -1)
		overwrite_var(env, index, new_var);
	else
		env->envp = add_var(env->envp, new_var);
}

void	overwrite_var(t_env *env, int index, char *new_var)
{
	free(env->envp[index]);
	env->envp[index] = new_var;
	return ;
}

/* Adds a new variable and its content to envp */
char	**add_var(char **envp, char *new_var)
{
	char	**new_envp;
	int		count;
	int		i;

	count = 0;
	while (envp && envp[count] != NULL)
		count++;
	new_envp = malloc(sizeof(char *) * (count + 2));
	if (!new_envp)
		return (envp);
	i = 0;
	while (i < count)
	{
		new_envp[i] = envp[i];
		i++;
	}
	new_envp[count] = new_var;
	new_envp[count + 1] = NULL;
	free(envp);
	return (new_envp);
}

int	equal_found(char *arg)
{
	int	i;

	i = 0;
	while (arg[i] != '\0')
	{
		if (arg[i] == '=')
			return (1);
		i++;
	}
	return (0);
}
